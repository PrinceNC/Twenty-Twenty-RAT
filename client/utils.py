import os
from time import ctime
from math import log2

def get_computer_uuid() -> str:
    import winreg
    registry = winreg.HKEY_LOCAL_MACHINE
    address = 'SOFTWARE\\Microsoft\\Cryptography'
    keyargs = winreg.KEY_READ | winreg.KEY_WOW64_64KEY
    key = winreg.OpenKey(registry, address, 0, keyargs)
    value = winreg.QueryValueEx(key, 'MachineGuid')
    winreg.CloseKey(key)
    uuid = value[0]
    return uuid

def get_computer_name() -> str:
    import winreg
    registry = winreg.HKEY_LOCAL_MACHINE
    address = 'SYSTEM\\CurrentControlSet\\Control\\ComputerName\\ComputerName'
    keyargs = winreg.KEY_READ | winreg.KEY_WOW64_64KEY
    key = winreg.OpenKey(registry, address, 0, keyargs)
    value = winreg.QueryValueEx(key, 'ComputerName')
    winreg.CloseKey(key)
    name = value[0]
    return name

def human_readable_file_size(size):
    _suffixes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    order = int(log2(size) / 10) if size else 0
    return '{:.4g} {}'.format(size / (1 << (order * 10)), _suffixes[order])

def process_files(directory_files, base_directory):
    files = []
    for file in directory_files:
        if file.is_dir():
            size = '--'
            size_sort = -1
        else:
            size = human_readable_file_size(file.stat().st_size)
            size_sort = file.stat().st_size
        files.append({
            'name': file.name,
            'is_dir': file.is_dir(),
            'rel_path': os.path.relpath(file.path, base_directory),
            'size': size,
            'size_sort': size_sort,
            'last_modified': ctime(file.stat().st_mtime),
            'last_modified_sort': file.stat().st_mtime
        })
    return files

def get_parent_directory(path, base_directory):
    difference = os.path.relpath(path, base_directory)
    difference_fields = difference.split('/')
    if len(difference_fields) == 1:
        return ''
    else:
        return '/'.join(difference_fields[:-1])
