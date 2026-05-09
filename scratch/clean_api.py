import os
import re

api_dir = 'src/app/api'

for root, dirs, files in os.walk(api_dir):
    for file in files:
        if file == 'route.ts':
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Remove generateStaticParams
            new_content = re.sub(r'export function generateStaticParams.*?\{.*?\}', '', content, flags=re.DOTALL)
            
            # Add force-dynamic if cookies() is used
            if 'cookies()' in new_content and 'export const dynamic = \'force-dynamic\'' not in new_content:
                new_content = "export const dynamic = 'force-dynamic';\n" + new_content
            
            if new_content != content:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated: {path}")
