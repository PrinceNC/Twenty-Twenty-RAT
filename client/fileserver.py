import http.server
import socketserver
import os
import threading
from multiprocessing import Queue
import time

from updog.utils import path as updogpathutil

from utils import process_files, get_parent_directory
from enums import Task


# Replace updog functions with patched versions
updogpathutil.process_files = process_files
updogpathutil.get_parent_directory = get_parent_directory

# Disable signal handler
from updog.__main__ import signal
signal.signal = lambda signal_Code, handler: None

from updog.__main__ import main as updog


class FileServer(http.server.SimpleHTTPRequestHandler):
    pass

def http_file_server(directory="C:\\"):
    print(os.getcwd())
    os.chdir(directory)
    print(os.getcwd())

    handler = FileServer

    PORT = 8000

    with socketserver.ThreadingTCPServer(("", PORT), handler) as file_server:
        print("Listening on port {}. Press Ctrl+C to stop.".format(PORT))

        try:
            file_server.serve_forever()
        except KeyboardInterrupt:
            pass
        except Exception as e:
            print(e)

        file_server.server_close()


def file_server(data: dict, communicationQueue: Queue):
    if data.get("directory", None) is None:
        data["directory"] = "C:\\"

    # DEBUG
    print("File server process - passed: ", data)

    try:
        os.chdir(data["directory"])

        file_server_thread = threading.Thread(target=updog)
        file_server_thread.daemon = True
        file_server_thread.start()
    except:
        return None

    sharing = True
    while sharing:
        try:
            if communicationQueue.empty() == False:
                task = communicationQueue.get()
                if task == Task.STOP.value:
                    sharing = False
        except:
            sharing = False


if __name__ == "__main__":
    file_server({}, Queue())