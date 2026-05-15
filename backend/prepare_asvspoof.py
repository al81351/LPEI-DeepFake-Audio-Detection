import os
import shutil
import random

PROTOCOL_PATH = r"C:\Projects\ASVspoof2019\ASVspoof2019_LA_cm_protocols\ASVspoof2019.LA.cm.train.trn.txt"
FLAC_DIR      = r"C:\Projects\ASVspoof2019\ASVspoof2019_LA_train\flac"
REAL_OUT      = r"C:\Projects\LPEI-DeepFake-Audio-Detection\data\real_audio"
FAKE_OUT      = r"C:\Projects\LPEI-DeepFake-Audio-Detection\data\deepfake_audio"
SAMPLES_EACH  = 1000

random.seed(42)

real_files, fake_files = [], []

with open(PROTOCOL_PATH, "r") as f:
    for line in f:
        parts = line.strip().split()
        filename = parts[1]
        label    = parts[-1]
        path     = os.path.join(FLAC_DIR, filename + ".flac")
        if not os.path.exists(path):
            continue
        if label == "bonafide":
            real_files.append(path)
        elif label == "spoof":
            fake_files.append(path)

real_sample = random.sample(real_files, min(SAMPLES_EACH, len(real_files)))
fake_sample = random.sample(fake_files, min(SAMPLES_EACH, len(fake_files)))

os.makedirs(REAL_OUT, exist_ok=True)
os.makedirs(FAKE_OUT, exist_ok=True)

for src in real_sample:
    shutil.copy(src, REAL_OUT)

for src in fake_sample:
    shutil.copy(src, FAKE_OUT)

print(f"Copiados {len(real_sample)} reais e {len(fake_sample)} deepfakes.")