#!/usr/bin/env python
import cv2
import numpy as np
import mediapipe as mp
import json
import base64
import time
import sys

# Initialize MediaPipe Pose and drawing utilities.
mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils

def calculate_angle(a, b, c):
    """Calculate the angle (in degrees) between three points using the cosine rule."""
    a = np.array([a.x, a.y])
    b = np.array([b.x, b.y])
    c = np.array([c.x, c.y])
    ba = a - b
    bc = c - b
    cosine_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc))
    angle = np.degrees(np.arccos(np.clip(cosine_angle, -1.0, 1.0)))
    return angle

def process_webcam(exercise_type):
    cap = cv2.VideoCapture(0)  # Use webcam device 0
    rep_count = 0
    is_active = False

    with mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5) as pose:
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            # Process frame
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = pose.process(frame_rgb)

            if results.pose_landmarks:
                mp_drawing.draw_landmarks(frame, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)
                landmarks = results.pose_landmarks.landmark

                # Example: Only implement Bench Press logic for brevity.
                if exercise_type == "Bench Press":
                    angle = calculate_angle(landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER],
                                            landmarks[mp_pose.PoseLandmark.LEFT_ELBOW],
                                            landmarks[mp_pose.PoseLandmark.LEFT_WRIST])
                    if angle < 90 and not is_active:
                        is_active = True
                    elif angle > 160 and is_active:
                        rep_count += 1
                        is_active = False

                # (Add additional exercise types as needed)

            # Overlay rep count on the frame.
            cv2.putText(frame, f"Reps: {rep_count}", (50, 50),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

            # Encode the processed frame as JPEG.
            ret2, buffer = cv2.imencode('.jpg', frame)
            if not ret2:
                continue
            jpg_as_text = base64.b64encode(buffer).decode('utf-8')

            # Prepare the JSON data.
            data = {
                "rep_count": rep_count,
                "frame": jpg_as_text
            }
            # Print the JSON as a single line (flush immediately)
            print(json.dumps(data), flush=True)

            # Sleep briefly to control the frame rate (adjust as needed)
            time.sleep(0.1)

    cap.release()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python exercise_realtime.py <exercise_type>", file=sys.stderr)
        sys.exit(1)
    exercise_type = sys.argv[1]
    process_webcam(exercise_type)
