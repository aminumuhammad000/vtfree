import os
import re

def resolve_conflict(file_path):
    with open(file_path, 'r') as f:
        content = f.read()
    
    # regex to find conflict blocks
    # <<<<<<< HEAD
    # (ours)
    # =======
    # (theirs)
    # >>>>>>> ...
    
    pattern = re.compile(r'<<<<<<< HEAD\n(.*?)\n?=======\n(.*?)\n?>>>>>>> [0-9a-f]+', re.DOTALL)
    
    new_content = pattern.sub(r'\1', content)
    
    if new_content != content:
        with open(file_path, 'w') as f:
            f.write(new_content)
        print(f"Resolved conflicts in {file_path}")
        return True
    return False

def main():
    root_dir = '/home/amee/Desktop/vtfree/super-admin/src'
    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if file.endswith(('.tsx', '.ts', '.js', '.jsx', '.css')):
                file_path = os.path.join(root, file)
                resolve_conflict(file_path)

if __name__ == "__main__":
    main()
