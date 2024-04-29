import matplotlib.pyplot as plt
import numpy as np
import json


def stringify_func(func):
    if func == "bcast":
        return "Broadcast"
    if func == "reduce":
        return "Reduce"
    if func == "allreduce":
        return "AllReduce"
    if func == "barrier":
        return "Barrier"


def plot(data_dict, name, color, yaxis="Speedup"):
    # Extract keys (labels) and values (y-values) from the dictionary
    labels = list(data_dict.keys())
    y_values = list(data_dict.values())

    # Create a figure and axis
    fig, ax = plt.subplots()

    # Calculate the positions for bars based on the length of the data
    x_positions = np.arange(len(labels))

    # Plot the bar graph
    ax.bar(x_positions, y_values, align="center", alpha=0.7, color=color)

    # Set labels and title
    ax.set_xlabel("Number of Processors")
    ax.set_ylabel(yaxis)
    ax.set_title("" + name)

    # Set x-axis tick labels to be the specified labels
    ax.set_xticks(x_positions)
    ax.set_xticklabels(labels)

    # Show the plot
    # plt.show()

    # Save plot as pdf
    path = f"{yaxis}_{name}.png"
    plt.savefig(path, dpi=300, bbox_inches="tight")
    plt.close()


def make_speedup(state, interconnect, func):
    print(f"state: {state}, interconnect: {interconnect}, func: {func}")
    return {
        num_procs: (
            data[state]["unoptimized"][interconnect][func][num_procs]
            / data[state]["optimized"][interconnect][func][num_procs]
        )
        for num_procs in data[state]["unoptimized"][interconnect][func].keys()
    }


interconnect = "Unknown"
num_procs = -1
optimized = "Unknown"
state = "Unknown"

data = {}

with open("./MPI benchmarks.txt", "r") as file:
    # read line by line
    lines = file.readlines()
    # remove the first line
    for l in lines:
        if l.__contains__("Local tests"):
            state = "local"
        elif l.__contains__("Global tests"):
            state = "global"
        elif l.__contains__("Not optimized"):
            optimized = "unoptimized"
        elif l.__contains__("Optimized"):
            optimized = "optimized"
        elif l.__contains__("Crossbar"):
            interconnect = "crossbar"
        elif l.__contains__("Ring"):
            interconnect = "ring"
        elif l.__contains__("Tree"):
            interconnect = "tree"
        elif l.__contains__("num_procs"):
            l = l.split(" ")
            if len(l) == 2:
                num_procs = int(l[1])
        elif l.__contains__(" ms"):
            l = l.split(" ")
            l.reverse()
            time = float(l[1])
            func = l[3]

            id = (state, interconnect, num_procs, optimized)

            if state == "Unknown" or interconnect == "Unknown" or num_procs == -1 or optimized == "Unknown":
                print(state, interconnect, num_procs, optimized)
                raise Exception("Invalid arguments")

            if state not in data:
                data[state] = {}

            if optimized not in data[state]:
                data[state][optimized] = {}

            if interconnect not in data[state][optimized]:
                data[state][optimized][interconnect] = {}

            if func not in data[state][optimized][interconnect]:
                data[state][optimized][interconnect][func] = {}

            data[state][optimized][interconnect][func][num_procs] = time

# save to file
with open("data.json", "w") as file:
    json.dump(data, file, indent=4)
# data[state][optimized][interconnect][func][num_procs] = time


for i in ["crossbar", "ring", "tree"]:
    print(f"local_{i}")
    color = "red" if i == "crossbar" else "blue" if i == "ring" else "green"
    for func in data["local"]["optimized"][i].keys():
        plot(
            make_speedup("local", i, func),
            f"Local {stringify_func(func)} with {i.capitalize()} Interconnect Optimization Speedup",
            color=color,
        )

print(f"global_tree")
color = "purple"
for func in data["global"]["optimized"]["tree"].keys():
    plot(
        make_speedup("global", "tree", func),
        f"Global {stringify_func(func)} Optimization Speedup",
        color=color,
    )


for o in ["optimized", "unoptimized"]:
    for i in ["crossbar", "ring", "tree"]:
        print(f"local_{o}_{i}")
        color = "red" if i == "crossbar" else "blue" if i == "ring" else "green"
        for func, value in data["local"][o][i].items():
            plot(
                value,
                f"Local {o.capitalize()} {stringify_func(func)} with {i.capitalize()} Interconnect Time",
                color=color,
                yaxis="Time (ms)",
            )

for o in ["optimized", "unoptimized"]:
    print(f"global_{o}_tree")
    color = "purple"
    for func, value in data["global"][o]["tree"].items():
        plot(
            value,
            f"Global {o.capitalize()} {stringify_func(func)} Time",
            color=color,
            yaxis="Time (ms)",
        )
