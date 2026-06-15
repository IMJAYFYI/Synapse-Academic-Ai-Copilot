import os

def fix_urls():
    for root, dirs, files in os.walk('frontend/src'):
        for f in files:
            if f.endswith(('.jsx', '.js')):
                filepath = os.path.join(root, f)
                with open(filepath, 'r', encoding='utf-8') as file:
                    content = file.read()
                
                if 'http://localhost:8000' in content:
                    # Replace standard string endpoints
                    content = content.replace("'http://localhost:8000", "(import.meta.env.VITE_API_URL || 'http://localhost:8000') + '")
                    content = content.replace("\"http://localhost:8000", "(import.meta.env.VITE_API_URL || \"http://localhost:8000\") + \"")
                    
                    # Handle template literals explicitly (e.g., `http://localhost:8000/api/...`)
                    content = content.replace("`http://localhost:8000", "`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}")
                    
                    with open(filepath, 'w', encoding='utf-8') as file:
                        file.write(content)
                    print(f"Fixed {filepath}")

if __name__ == '__main__':
    fix_urls()
