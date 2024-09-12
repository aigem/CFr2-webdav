import os

def read_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            return file.read()
    except FileNotFoundError:
        return f"文件不存在: {file_path}"
    except Exception as e:
        return f"读取文件时出错: {file_path}\n错误: {str(e)}"

def export_files(files, output_file):
    with open(output_file, 'w', encoding='utf-8') as out:
        for file_path in files:
            out.write(f"文件名：{file_path}\n")
            out.write(read_file(file_path))
            out.write("\n\n")
    print(f"文件内容已成功导出到 {output_file}")

files_to_export = [
    # "tsconfig.json",
    # "src/utils/templates.ts",
    # "package.json",
    "src/index.ts",
    "src/types.ts",
    # "src/handlers/requestHandler.ts",
    "src/handlers/webdavHandler.ts",
    "src/utils/auth.ts",
    "src/utils/cors.ts",
    "src/utils/logger.ts",
    "src/utils/webdavUtils.ts"
]

output_file = "output.txt"
export_files(files_to_export, output_file)