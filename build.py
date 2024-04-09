import shutil
import os
import subprocess


print("\033[33m/workspace will be overwritten by mpi_core/examples\033[0m")


def copy_and_overwrite(from_path, to_path):
    if os.path.exists(to_path):
        shutil.rmtree(to_path)
    shutil.copytree(from_path, to_path)


subprocess.run(["pip3", "install", "black"])
subprocess.run(["black", "--verbose", "--line-length", "120", "."])
subprocess.run(["npm", "i"], cwd="mpi_js/client")
subprocess.run(["npm", "run", "lint"], cwd="mpi_js/client")
subprocess.run(["npm", "run", "build"], cwd="mpi_js/client")

copy_and_overwrite("mpi_js/client/build/mpi_core/workspace", "workspace")
