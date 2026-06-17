import re

def replace_font_in_quran_blocks(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        return
        
    # We want to change 'font-arabic' to 'font-quran' in verse sections.
    # In FeedCard.tsx, StoriesRow.tsx, page.tsx, ShareReflectionModal.tsx, etc.,
    # Verse sections typically have `{verse && (` or `verse.text` or similar.
    # To be safe and precise, we can split by blocks or just use careful regex.
    # But an easier way is to just find the exact lines for Quran and change them.
    
    lines = content.split('\n')
    in_verse_block = False
    in_hadith_block = False
    
    for i, line in enumerate(lines):
        if 'verse && (' in line or 'verse &&' in line or '{verse.' in line or '{activeStory.verse' in line or '{post.verse' in line:
            in_verse_block = True
            
        if 'hadith && (' in line or 'hadith &&' in line or '{hadith.' in line or '{activeStory.hadith' in line or '{post.hadith' in line:
            in_hadith_block = True
            
        # Also, check if it's a verse text directly
        if 'font-arabic' in line:
            # If we are in a verse block or the line explicitly references verse
            if in_verse_block and not in_hadith_block:
                lines[i] = line.replace('font-arabic', 'font-quran')
            elif ('verse' in line.lower() or 'surah' in line.lower() or 'ayah' in line.lower()) and 'hadith' not in line.lower():
                lines[i] = line.replace('font-arabic', 'font-quran')
            
        # Reset block flags when div closes. This is a bit heuristic, so instead
        # let's just do it line by line based on nearby context if possible.
        # But wait, in JSX, it's safer to just find the specific lines.
    
    # Actually, let's just do a manual targeted replace for the exact lines that have `font-arabic` and are verses.
    
    pass

# Let's do it with precise regex for the specific files
def process_file(file_path, replace_all=False):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        return

    if replace_all:
        content = content.replace('font-arabic', 'font-quran')
    else:
        # We need to distinguish verse from hadith.
        # Let's split the file into chunks using `hadith &&` and `verse &&`
        # Actually, let's just find lines with `font-arabic` and if the block is verse, replace.
        # A simpler way: Find all occurrences of 'font-arabic'. Look at the text inside the element or the preceding comments.
        
        # In FeedCard.tsx, StoriesRow.tsx, Post/page.tsx, ShareReflectionModal.tsx:
        # The verse section usually has `{verse.text}`.
        # Let's replace 'font-arabic' with 'font-quran' if it's within 300 characters before `{verse.text}` or `{post.verse.text}` or `{activeStory.verse.text}`
        
        # Using a regex to replace 'font-arabic' that appears before `{.*?verse\.text\}`
        new_content = re.sub(r'font-arabic(?=.*?\{[^\}]*?verse\.text\})', 'font-quran', content, flags=re.DOTALL)
        
        # But what about `{verse && ( ... <p className="font-arabic ...>{verse.text}</p>`?
        # The above regex might match a hadith if it's before a verse. So DOTALL over 300 chars is better.
        
        # Let's do it manually.
        pass

def fix_all():
    # Files to replace ALL 'font-arabic' with 'font-quran'
    pure_quran_files = [
        r'c:\Hidayah\src\app\surahs\[id]\ClientShell.tsx',
        r'c:\Hidayah\src\app\quran\page.tsx',
        r'c:\Hidayah\src\app\quran\read\[page]\QuranReaderClient.tsx',
        r'c:\Hidayah\src\components\quran\InteractiveVerse.tsx',
        r'c:\Hidayah\src\app\surahs\page.tsx',
    ]
    
    for f in pure_quran_files:
        try:
            with open(f, 'r', encoding='utf-8') as file:
                content = file.read()
            new_content = content.replace('font-arabic', 'font-quran')
            with open(f, 'w', encoding='utf-8') as file:
                file.write(new_content)
            print(f'Updated {f}')
        except Exception as e:
            print(f'Failed {f}: {e}')

    # For mixed files, let's read and replace interactively.
    mixed_files = [
        r'c:\Hidayah\src\components\community\FeedCard.tsx',
        r'c:\Hidayah\src\components\community\StoriesRow.tsx',
        r'c:\Hidayah\src\app\community\post\[id]\page.tsx',
        r'c:\Hidayah\src\components\community\ShareReflectionModal.tsx',
        r'c:\Hidayah\src\app\community\create\page.tsx',
    ]
    
    for f in mixed_files:
        try:
            with open(f, 'r', encoding='utf-8') as file:
                content = file.read()
            
            # We split by 'font-arabic'. If the word 'verse' or 'surah' or 'ayah' is in the vicinity (e.g. within next 200 chars), we replace.
            parts = content.split('font-arabic')
            new_content = parts[0]
            for i in range(1, len(parts)):
                # look at the next 250 characters
                context = parts[i][:250].lower()
                if ('verse' in context or 'surah' in context or 'ayah' in context or 'quran' in context) and 'hadith' not in context:
                    new_content += 'font-quran' + parts[i]
                else:
                    # If it's the create page, previewing verse:
                    if 'verse' in parts[i-1][-200:].lower() and 'hadith' not in parts[i-1][-200:].lower():
                        new_content += 'font-quran' + parts[i]
                    else:
                        new_content += 'font-arabic' + parts[i]
            
            with open(f, 'w', encoding='utf-8') as file:
                file.write(new_content)
            print(f'Updated {f}')
        except Exception as e:
            print(f'Failed {f}: {e}')

if __name__ == '__main__':
    fix_all()
