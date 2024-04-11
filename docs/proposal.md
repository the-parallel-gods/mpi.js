## PROJECT: MPI.JS

## **URL**

[https://the-parallel-gods.gitbook.io/mpi](https://the-parallel-gods.gitbook.io/mpi)

## **SUMMARY**

**We want to create an MPI library in the browser using JavaScript, implement some of the APIs (bcast, all\_gather, all\_reduce, ...), optimize them given the browser environment, and benchmark them using existing MPI programs.**

## BACKGROUND & PLATFORM CHOICE

> Atwood’s Law: “Any application that can be written in JavaScript, will eventually be written in JavaScript.”

JavaScript is one of the most popular languages used by many developers. It also runs across diverse platforms. To make MPI accessible to more programmers and compatible with more devices, we introduce it to JavaScript.

As described in [#the-challenge](proposal.md#the-challenge "mention"), JS is an inherently single-threaded programming language. Thus, shared-memory parallel models similar to OpenMP are simply not possible. However, we can still pass messages between multiple "isolated threads" in JS. In such an environment, MPI becomes the perfect solution for parallel programming.

## THE CHALLENGE

* MPI has never been implemented in JavaScript in the browser before, so we may run into many new problems specific to the runtime environment
  * JavaScript is a single-threaded language, so we need to find alterative ways to perform parallel work
  * Each thread in the browser has much isolation for security reasons, (ie no shared memory), so communication methods are limited
* We will have to carefully study how the APIs are implemented in MPI, and optimize them for the JavaScript environment's characteristics
* We need to carefully design and optimize the communication hierarchy of MPI nodes and MPI threads, since we wish to support nodes across multiple computers over the Internet
* We need to convert existing MPI programs into our JavaScript framework to benchmark our speedup performance

## RESOURCES

* We will develop the library from scratch on our laptops, to begin with
* When finished, we will attempt to install it onto PSC to test the speedup
* We will reference OpenMPI to learn how to implement the APIs ([https://github.com/open-mpi](https://github.com/open-mpi))

## PLAN TO ACHIEVE

* [x] **Make a nice documentation website**
* [ ] **Implement the following APIs**
  * [ ] Basics
    * [ ] MPI\_Init
    * [ ] MPI\_Finalize
    * [ ] MPI\_Abort
    * [ ] MPI\_Comm\_size
    * [ ] MPI\_Comm\_rank
  * [ ] P2P
    * [ ] MPI\_Send
    * [ ] MPI\_Isend
    * [ ] MPI\_Recv
    * [ ] MPI\_Irecv
  * [ ] Barriers & Broadcasts
    * [ ] MPI\_Barrier
    * [ ] MPI\_Ibarrier
    * [ ] MPI\_Bcast
    * [ ] MPI\_Ibcast
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
* [ ] **Write the tool that transplants user JS code into runnable MPI.js code**
* [ ] **Compare different communication methods (channels/WebSockets) between local threads**
* [ ] **Use WebSockets to connect MPI nodes across multiple computers**
* [ ] **Optimize for memory usage by using clever message-routing techniques**
* [ ] **Run benchmarks on all variations of our API**

## HOPE TO ACHIEVE

* [ ] **Make a live dashboard that shows how many msgs/sec are happening in real-time**
* [ ] **Make a debugging dashboard that replays the communications during computation**
* [ ] **Implement the following APIs**
  * [ ] MPI\_Scan
  * [ ] MPI\_Exscan

## DEVERLIABLES

### The final framework should...

* ...achieve reasonable speedup (not absolute speed, due to JS) for MPI programs that are not extremely communication-heavy on a single-computer setup
* ...successfully run on a smartphone with a compatible browser
* ...successfully run across multiple computers over the Internet
* ...not be run on anyone's smart toaster : )

### DEMO DAY

* We will show the speedup graph of running existing MPI programs on the poster
* We will set up a laptop to produce a live demo of running MPI in the browser



## SCHEDULE

| Date                 | Sean                               | David                           |
| -------------------- | ---------------------------------- | ------------------------------- |
| 3/28                 | Submit Proposal                    | Submit Proposal                 |
| 4/10                 | Set up P2P                         | Set up Basics API               |
| 4/11                 | Finish JS transplanter             |                                 |
| 4/13                 | Set up local results downloader    | Gather, Scatter                 |
| 4/17 (By Checkpoint) |                                    | Reduce/Broadcast                |
| 4/24                 | Websocket support with current API | Set up routing protocol options |
| 5/3                  | Live Dashboard                     | Debugging Data Collection       |
| 5/4                  | Submit Report                      | Submit Report                   |
| 5/6                  | Demo Day                           | Demo Day                        |

## ABOUT US

### Sean (haoxians)

[Sean](https://github.com/SeanSun6814) and 


### David (drudo)

[David](https://github.com/1CoolDavid)