"""
Ajusta data/real_audio/ para ficares com:
  - 500 ASVspoof FLAC  (remove 500 dos 1000 actuais)
  - 500 spontaneous-speech-en-*.mp3  (mantém — não toca)
  - 500 Common Voice PT  (adiciona — clips validados em train.tsv)
  - 13 RealVoice_*.wav  (mantém — não toca)
  ─────────────────────────────────────
  Total: ~1513 real  vs  1512 fake  → balanço perfeito

Uso:
    python prepare_real_audio.py
"""

import os
import sys
import shutil
import random
import csv

# ── Configuração ─────────────────────────────────────────────────────────────

COMMON_VOICE_DIR = os.path.join(
    os.environ["USERPROFILE"], "Downloads",
    "1774208832593-cv-corpus-25.0-2026-03-09-pt",
    "cv-corpus-25.0-2026-03-09", "pt"
)
CLIPS_DIR = os.path.join(COMMON_VOICE_DIR, "clips")
TRAIN_TSV = os.path.join(COMMON_VOICE_DIR, "train.tsv")

REAL_AUDIO_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "real_audio")

N_KEEP_ASVSPOOF = 500   # quantos FLAC do ASVspoof manter (remove o resto)
N_CV_PT         = 500   # quantos clips Common Voice PT adicionar
RANDOM_SEED     = 42

# ─────────────────────────────────────────────────────────────────────────────

def main():
    # 1. Verificar paths
    for path, label in [
        (CLIPS_DIR,      "Common Voice clips/"),
        (TRAIN_TSV,      "train.tsv"),
        (REAL_AUDIO_DIR, "data/real_audio/"),
    ]:
        if not os.path.exists(path):
            print(f"ERRO: não encontrado — {label}\n  ({path})")
            sys.exit(1)

    random.seed(RANDOM_SEED)

    # 2. Listar todos os FLAC ASVspoof actuais (LA_T_*.flac)
    flac_files = sorted(
        f for f in os.listdir(REAL_AUDIO_DIR)
        if f.endswith(".flac") and f.startswith("LA_T_")
    )
    print(f"ASVspoof FLAC encontrados : {len(flac_files)}")

    if len(flac_files) <= N_KEEP_ASVSPOOF:
        print(f"  Já tens {len(flac_files)} ≤ {N_KEEP_ASVSPOOF} — nenhum FLAC removido.")
    else:
        to_keep   = set(random.sample(flac_files, N_KEEP_ASVSPOOF))
        to_remove = [f for f in flac_files if f not in to_keep]
        for f in to_remove:
            os.remove(os.path.join(REAL_AUDIO_DIR, f))
        print(f"  Mantidos : {N_KEEP_ASVSPOOF}  |  Removidos : {len(to_remove)}")

    # 3. Verificar spontaneous-speech-en-*.mp3 (não toca — só informa)
    spontaneous = [
        f for f in os.listdir(REAL_AUDIO_DIR)
        if f.startswith("spontaneous-speech-en-") and f.endswith(".mp3")
    ]
    print(f"spontaneous-speech-en-*.mp3 mantidos: {len(spontaneous)}")

    # 4. Ler train.tsv e recolher clips que existem fisicamente
    print(f"\nA ler train.tsv ...")
    valid_clips = []
    with open(TRAIN_TSV, encoding="utf-8", newline="") as fh:
        reader = csv.DictReader(fh, delimiter="\t")
        for row in reader:
            clip_name = row.get("path", "").strip()
            if not clip_name:
                continue
            if not clip_name.endswith(".mp3"):
                clip_name += ".mp3"
            full_path = os.path.join(CLIPS_DIR, clip_name)
            if os.path.isfile(full_path):
                valid_clips.append(full_path)

    print(f"Clips válidos em train.tsv : {len(valid_clips)}")

    n = min(N_CV_PT, len(valid_clips))
    if n < N_CV_PT:
        print(f"AVISO: só há {len(valid_clips)} clips — a usar todos.")

    # 5. Remover cv_pt_* antigos (se já existirem de execuções anteriores)
    old_cvpt = [f for f in os.listdir(REAL_AUDIO_DIR) if f.startswith("cv_pt_")]
    if old_cvpt:
        for f in old_cvpt:
            os.remove(os.path.join(REAL_AUDIO_DIR, f))
        print(f"Removidos {len(old_cvpt)} clips Common Voice PT anteriores.")

    # 6. Copiar N clips aleatórios para data/real_audio/
    selected = random.sample(valid_clips, n)
    print(f"\nA copiar {n} clips Common Voice PT ...")
    copied = 0
    for src in selected:
        dest = os.path.join(REAL_AUDIO_DIR, "cv_pt_" + os.path.basename(src))
        shutil.copy2(src, dest)
        copied += 1
        if copied % 100 == 0:
            print(f"  {copied}/{n} copiados...")
    print(f"  {copied} clips copiados.")

    # 7. Resumo final
    all_files = os.listdir(REAL_AUDIO_DIR)
    flac_final = sum(1 for f in all_files if f.endswith(".flac"))
    wav_final  = sum(1 for f in all_files if f.endswith(".wav"))
    spon_final = sum(1 for f in all_files if f.startswith("spontaneous-speech-en-"))
    cvpt_final = sum(1 for f in all_files if f.startswith("cv_pt_"))

    print(f"\n── Resumo data/real_audio/ ──────────────────")
    print(f"  ASVspoof .flac             : {flac_final}")
    print(f"  spontaneous-speech-en .mp3 : {spon_final}")
    print(f"  Common Voice PT .mp3       : {cvpt_final}")
    print(f"  RealVoice .wav             : {wav_final}")
    print(f"  TOTAL                      : {len(all_files)}")
    print(f"─────────────────────────────────────────────")
    print(f"\nPróximo passo:  python train.py")


if __name__ == "__main__":
    main()
