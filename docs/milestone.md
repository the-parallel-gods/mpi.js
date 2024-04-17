## PROJECT: MPI.JS -- Milestone Report

## **URL**

[https://the-parallel-gods.gitbook.io/mpi](https://the-parallel-gods.gitbook.io/mpi)


## BACKGROUND & PLATFORM CHOICE

> Atwood’s Law: “Any application that can be written in JavaScript, will eventually be written in JavaScript.”

JavaScript is one of the most popular languages used by many developers. It also runs across diverse platforms. To make MPI accessible to more programmers and compatible with more devices, we introduce it to JavaScript.

As described in [#the-challenge](proposal.md#the-challenge "mention"), JS is an inherently single-threaded programming language. Thus, shared-memory parallel models similar to OpenMP are simply not possible. However, we can still pass messages between multiple "isolated threads" in JS. In such an environment, MPI becomes the perfect solution for parallel programming.

## Summary On Progress



## Current Project Status

* [x] **Make a nice documentation website**
* [ ] **Implement the following APIs**
  * [x] Basics
    * [x] MPI\_Init
    * [x] MPI\_Finalize
    * [x] MPI\_Abort
    * [x] MPI\_Comm\_size
    * [x] MPI\_Comm\_rank
  * [x] P2P
    * [x] MPI\_Send
    * [x] MPI\_Isend
    * [x] MPI\_Recv
    * [x] MPI\_Irecv
  * [x] Barriers & Broadcasts
    * [x] MPI\_Barrier
    * [x] MPI\_Ibarrier
    * [x] MPI\_Bcast
    * [x] MPI\_Ibcast
  * [ ] Gathers
    * [ ] MPI\_Gather
    * [ ] MPI\_Gatherv
    * [ ] MPI\_Igather
    * [ ] MPI\_Igatherv
    * [ ] MPI\_Allgather
    * [ ] MPI\_Allgatherv
    * [ ] MPI\_Iallgather
  * [ ] Scatters
    * [ ] MPI\_Scatter
    * [ ] MPI\_Scatterv
    * [ ] MPI\_Iscatter
    * [ ] MPI\_Iscatterv
  * [ ] Reduces
    * [ ] MPI\_Reduce
    * [ ] MPI\_Ireduce
    * [ ] MPI\_Allreduce
    * [ ] MPI\_Iallreduce
* [x] **Write the tool that transplants user JS code into runnable MPI.js code**
* [ ] **Compare different communication methods (channels/WebSockets) between local threads**
* [x] **Use WebSockets to connect MPI nodes across multiple computers**
* [ ] **Optimize for memory usage by using clever message-routing techniques**
* [ ] **Run benchmarks on all variations of our API**

## HOPE TO ACHIEVE

* [x] **Make a live dashboard that shows how many msgs/sec are happening in real-time**
* [ ] **Make a debugging dashboard that replays the communications during computation**
* [ ] **Implement the following APIs**
  * [ ] MPI\_Scan
  * [ ] MPI\_Exscan

## Goals Being Removed
After considering our progress and discoveries made while working on mpi.js, we've decided to no longer pursue the idea of a "debugging" dashboard. The amount of memory necessary to hold the timeline information necessary to implement such a dashboard is too large to be feasibly completed without detracting from the original project. Since we still need to work on the different routing strategies for reduce, gather, and scatter it is also more likely that we will not have time to implement scan since we want to dedicate time to have interesting data to compare. 

## Issues that Concern Us


## Intentions For Poster Session
Our intention is to use our in-development dashboard as our main presentation tool. Since it shows a break down of time a process spends sending, receiving, waiting, and actually computing it's a great way to visually show the relative speed up we are providing to a program. We also plan to show some pre-captured measurements from the dashboard so that the demo doesn't have to manually run through every variation of our mpi configurations we want to analyze.



## Updated SCHEDULE

| Date                 | Sean                                  | David                                     |
| -------------------- | ------------------------------------- | ----------------------------------------- |
| 3/28                 | Submit Proposal                       | Submit Proposal                           |
| 4/10                 | Set up P2P                            | Set up Basics API                         |
| 4/11                 | Finish JS transplanter                | Set up route forwarding data              |
| 4/13                 | Live Dashboard                        | Set up Websocket support with current API |
| 4/17 (By Checkpoint) | Set up routing local protocol options | Set up global protocol options            |
| 4/24                 | Gather, Scatter                       | Reduce/Broadcast                          |
| 5/3                  | Set up local results downloader       |                                           |
| 5/4                  | Submit Report                         | Submit Report                             |
| 5/6                  | Demo Day                              | Demo Day                                  |

## ABOUT US

### Sean (haoxians)

[Sean](https://github.com/SeanSun6814) and 


### David (drudo)

[David](https://github.com/1CoolDavid)