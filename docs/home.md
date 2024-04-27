# MPI.js

_MPI, now on the web._

## The vision

> **Our mission is to revolutionize impractical distributed computing by providing a browser-based MPI implementation that empowers researchers and developers to seamlessly explore parallel programming concepts and deploy distributed applications across diverse platforms.**

## For developers

[Get Started](/mpi.js/docs)

[Github](https://github.com/the-parallel-gods/mpi.js)

## Roadmap


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
  * [ ] Barriers & Broadcasts
    * [x] MPI\_Barrier
    * [ ] MPI\_Ibarrier
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
    * [x] MPI\_Reduce
    * [ ] MPI\_Ireduce
    * [x] MPI\_Allreduce
    * [ ] MPI\_Iallreduce
* [x] **Write the tool that transplants user JS code into runnable MPI.js code**
* [x] **Compare different communication methods (channels/WebSockets) between local threads**
* [x] **Use WebSockets to connect MPI nodes across multiple computers**
* [x] **Optimize for memory usage by using clever message-routing techniques**
* [ ] **Run benchmarks on all variations of our API**

## HOPE TO ACHIEVE

* [x] **Make a live dashboard that shows how many msgs/sec are happening in real-time**
* [ ] **<strike>Make a debugging dashboard that replays the communications during computation</strike>**
* [ ] **<strike>Implement the following APIs</strike>**
  * [ ] <strike>MPI\_Scan</strike>
  * [ ] <strike>MPI\_Exscan</strike>

## About us

We are [the-parallel-gods](https://github.com/the-parallel-gods)

[Sean](https://github.com/SeanSun6814) and [David](https://github.com/1CoolDavid)

## Support & warranty

lmao
