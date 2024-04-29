## PROJECT: MPI.JS

## **URL**

[https://the-parallel-gods.github.io/mpi.js/home/](https://the-parallel-gods.github.io/mpi.js/home/)

## **SUMMARY**

**We want to create an MPI library in the browser using JavaScript, implement some of the APIs (bcast, all\_gather, all\_reduce, ...), optimize them given the browser environment, and benchmark them using existing MPI programs.**

## BACKGROUND

One of the key structures we implemented to further our analogy of individual tabs acting as cores of a cpu were interconnects. Designed as a custom routing table, mpi.js supports a ring, tree, and crossbar interconnect for analysis. Our interconnects define the potential routes a node can use when sending messages across the local or global network of processes. The primary challenge when applying these interconnects to a highly distributed, parallel environment was setting a scheme where "node ids" required as little translation as possible to reduce any potential unnecessary overhead during sends and receives. Our "trick" to solve this is to have two sets of routers that help enable fast and efficient communication between nodes without burdening each tab to calculate the optimal route necessary for broadcast, reduce, or any other function. Our "Node Router" focuses on handling messages within a local network. This is how messages between tabs on the same browser are handled. If a message needs to be sent to another a machine and go across our global network we designed a "Global Router." The Global Router is connected to a GR network that on initialization does a handshake so that the centralized GR server knows all the routing information necessary. This allows the Global Routers to focus most of their computation on choosing how to forward incoming messages to the Node Router and leave most of the complex routing information to the central server. The "GR Server" has a modifiable routing table to ensure flexibility and fast forwarding. This server is also responsible for the designation of global identifiers that are essential in operations such as reduce and gather/scatter. This structure of routers allows for a divide-and-conquer break down of routing operations so that no one process is overburdened and our MPI worker tabs can remain primarily focused on strict computation unless specifically awaiting for a particular message.

## APPROACH

![](./images/mpi_sys_arch.png)



![](./images/milestone-dashboard.png)



## RESULTS


### Local Tests


#### ReduceAll

#### SSMR


### Global Tests


#### Broadcast

#### SSMR

#### Reduce

#### Barrier


## CREDIT

### Sean (haoxians) - 50%

[Sean](https://github.com/SeanSun6814)


### David (drudo) - 50%

[David](https://github.com/1CoolDavid)
