# MedMasters – Quick Setup

Follow the steps below to get MedMasters running with the pre‑trained model.

---

## 1. Install JS dependencies

```bash
npm install
```

---

## 2. Download the model

Grab **best_model1.h5** from Google Drive:

<https://drive.google.com/file/d/1i5PaLhpr6H48PHpPBbLb0Ta2hlXXDzvQ/view?usp=sharing>

---

## 3. Place the model in the project

```bash
mkdir -p src/python/classifier/models
mv /path/to/best_model1.h5 src/python/classifier/models/best_model1.h5
```

> **The file name and path must match exactly.**

---

## 4. Run MedMasters

### Development (hot reload)

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

Once you see:

```text
✔️  Loaded model from src/python/classifier/models/best_model1.h5
🚀  MedMasters listening on http://localhost:3000
```

you’re ready to go!
