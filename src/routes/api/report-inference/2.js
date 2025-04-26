import { json } from '@sveltejs/kit';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { tmpdir } from 'os';
import { fileURLToPath } from 'url';
import { pathToPyhton } from '../../../python/path.helper';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function POST({ request }) {
    try {
        // 1. Parse the multipart form data
        const formData = await request.formData();
        const fileField = formData.get('file');
        if (!fileField || typeof fileField === 'string') {
            return new Response('No file uploaded', { status: 400 });
        }

        // 2. Convert file data (ArrayBuffer) to Buffer, write to temp file
        const languageField = formData.get('language') || 'en';
        const arrayBuffer = await fileField.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const tempDir = tmpdir();
        const fileName = `upload-${Date.now()}.pdf`;
        const filePath = path.join(tempDir, fileName);
        await fs.writeFile(filePath, buffer);

        // 3. Spawn Python script to get raw "inferenceText"
        const scriptPath = `${pathToPyhton}/report-inference/report-inference.py`;
        const pythonProcess = spawn('python', [scriptPath, filePath, languageField]);

        let output = '';
        let errorOutput = '';

        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });
        pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        const exitCode = await new Promise((resolve) => {
            pythonProcess.on('close', resolve);
        });

        // Cleanup temp file
        await fs.unlink(filePath);

        if (exitCode !== 0) {
            console.error(`Python error: ${errorOutput}`);
            return new Response(`Python script error: ${errorOutput}`, { status: 500 });
        }

        // 4. We have the raw inference text
        let inferenceText = output.trim();

        // Data structures we'll fill
        let testType = '';
        const reportData = {};

        //--------------------------------------------------------------------
        // STEP A: Extract "Name of Test:" if present
        //--------------------------------------------------------------------
        const testTypeMatch = inferenceText.match(/Name of Test:\s*(.*)/i);
        if (testTypeMatch && testTypeMatch[1]) {
            testType = testTypeMatch[1].replace(/\*\*/g, '').trim();
        }

        //--------------------------------------------------------------------
        // STEP B: Find a "Table" block (without necessarily a colon)
        //         We'll look for the word "Table" (case-insensitive),
        //         then parse pipe-based lines until the next heading:
        //           "Inferences", "Plausible Remedies", "Disclaimer", or end.
        //--------------------------------------------------------------------
        // Regex to locate "Table" or "Table:" ignoring case
        const tableRegex = /Table\s*:?\s*/i;
        const tableMatch = tableRegex.exec(inferenceText);
        let tableStartIndex = -1;
        let tableEndIndex = -1;

        if (tableMatch) {
            tableStartIndex = tableMatch.index;
            // Next heading match (Inferences/Plausible Remedies/Disclaimer)
            const headingRegex = /(Inferences:|Inferences\b|Plausible Remedies:|Disclaimer:)/i;
            // We only search AFTER the "Table" match
            const afterTable = inferenceText.substring(tableStartIndex);
            const nextHeading = headingRegex.exec(afterTable);

            if (nextHeading) {
                // tableEndIndex (absolute) = tableStartIndex + index of next heading
                tableEndIndex = tableStartIndex + nextHeading.index;
            } else {
                // If no further heading, table goes to the end
                tableEndIndex = inferenceText.length;
            }
        }

        //--------------------------------------------------------------------
        // STEP C: Parse the pipe-based table lines into reportData
        //--------------------------------------------------------------------
        if (tableStartIndex !== -1 && tableEndIndex !== -1) {
            const tableSection = inferenceText.substring(tableStartIndex, tableEndIndex);

            // Split the table section into lines
            const lines = tableSection.split(/\r?\n/);
            // Filter lines that look like markdown table rows (starting with a pipe)
            const tableRows = lines.filter((line) => line.trim().startsWith('|'));

            if (tableRows.length > 1) {
                // Typically first row is header, second row is divider
                // We'll parse from the third row onwards
                const dataRows = tableRows.slice(2);

                dataRows.forEach((row) => {
                    // row looks like: "| Calcium | 9.8 | mg/dl | 8.4-10.4 | Yes |"
                    const cells = row
                        .split('|')
                        .map((cell) => cell.trim())
                        .filter((cell) => cell);

                    // Suppose columns are: [Test, Result, Unit, Reference Range, Normal Range?]
                    // We'll build a single string or parse them separately
                    if (cells.length >= 5) {
                        const paramName = cells[0];      // e.g. "Calcium"
                        const resultVal = cells[1];      // e.g. "9.8"
                        const unitVal = cells[2];        // e.g. "mg/dl"
                        const refRange = cells[3];       // e.g. "8.4-10.4"
                        const normalFlag = cells[4];     // e.g. "Yes" or "No"

                        // Build a combined string, e.g. "9.8 mg/dl (Ref: 8.4-10.4) - Normal? Yes"
                        let combined = `${resultVal} ${unitVal} (Ref: ${refRange}) - Normal? ${normalFlag}`;
                        reportData[paramName] = combined;
                    }
                    else if (cells.length >= 2) {
                        // fallback if table has fewer columns
                        const paramName = cells[0];
                        const paramValue = cells[1];
                        reportData[paramName] = paramValue;
                    }
                });
            }
        }

        //--------------------------------------------------------------------
        // STEP D: Remove the "Table" portion from the final inference
        //--------------------------------------------------------------------
        let finalInferenceText = inferenceText;
        if (tableStartIndex !== -1 && tableEndIndex !== -1) {
            finalInferenceText =
                inferenceText.substring(0, tableStartIndex) +
                inferenceText.substring(tableEndIndex);
        }

        //--------------------------------------------------------------------
        // STEP E: Clean up the final inference text
        //--------------------------------------------------------------------
        finalInferenceText = finalInferenceText
            .replace(/\*\*/g, '')   // remove markdown bold
            .replace(/\r?\n/g, ' ') // remove new lines
            .replace(/\s+/g, ' ')   // collapse extra spaces
            .trim();

        //--------------------------------------------------------------------
        // STEP F: If testType is still empty, do a quick fallback approach
        //--------------------------------------------------------------------
        if (!testType) {
            // We'll do a naive detection. Customize as you like.
            const knownTests = [
                'CBC',
                'Lipid Profile',
                'Blood Sugar',
                'Vitamin B12',
                'Vitamin D',
                'Calcium',
                'TSH'
            ];
            for (const t of knownTests) {
                if (inferenceText.toLowerCase().includes(t.toLowerCase())) {
                    testType = t;
                    break;
                }
            }
            if (!testType) {
                testType = 'General Lab Report';
            }
        }

        //--------------------------------------------------------------------
        // STEP G: Final JSON Output
        //--------------------------------------------------------------------
        const finalOutput = {
            result: finalInferenceText,
            reportData,
            testType
        };

        return json(finalOutput);

    } catch (err) {
        console.error(err);
        return new Response(`Internal Server Error: ${err}`, { status: 500 });
    }
}
