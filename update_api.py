import re
import os

# 1. Update src/lib/api.ts
api_path = r'c:\Hidayah\src\lib\api.ts'
try:
    with open(api_path, 'r', encoding='utf-8') as f:
        api_content = f.read()

    # Replace 'text_indopak' with 'text_uthmani'
    api_content = api_content.replace('text_indopak', 'text_uthmani')
    
    # Replace 'quran-indopak' with 'quran-uthmani'
    api_content = api_content.replace('quran-indopak', 'quran-uthmani')

    with open(api_path, 'w', encoding='utf-8') as f:
        f.write(api_content)
    print("Updated api.ts")
except Exception as e:
    print(f"Error api.ts: {e}")

# 2. Update QuranReaderClient.tsx
quran_reader_path = r'c:\Hidayah\src\app\quran\read\[page]\QuranReaderClient.tsx'
try:
    with open(quran_reader_path, 'r', encoding='utf-8') as f:
        qr_content = f.read()

    qr_content = qr_content.replace('verse.text_indopak', 'verse.text_uthmani')

    with open(quran_reader_path, 'w', encoding='utf-8') as f:
        f.write(qr_content)
    print("Updated QuranReaderClient.tsx")
except Exception as e:
    print(f"Error QuranReaderClient.tsx: {e}")

# 3. Update InteractiveVerse.tsx
inter_verse_path = r'c:\Hidayah\src\components\quran\InteractiveVerse.tsx'
try:
    with open(inter_verse_path, 'r', encoding='utf-8') as f:
        iv_content = f.read()

    iv_content = iv_content.replace('verse.text_indopak', 'verse.text_uthmani')

    with open(inter_verse_path, 'w', encoding='utf-8') as f:
        f.write(iv_content)
    print("Updated InteractiveVerse.tsx")
except Exception as e:
    print(f"Error InteractiveVerse.tsx: {e}")

