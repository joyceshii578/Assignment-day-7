SnapShare: Scaling Plan

SnapShare is a photo-sharing app where users upload photos and scroll a feed of photos from people they follow.

1. Assumptions
Registered users: 10,000,000
Active each day: 10%
Each active user uploads 1 photo per day
Each active user views 50 feed pages per day
Average photo: 2 MB; each photo also gets a 50 KB thumbnail
1 day = 86,400 seconds; 1 year = 365 days
Peak traffic = 5x the average
Storage uses decimal units (1 TB = 1,000,000 MB)
Photos are never deleted, and the 2 MB original and 50 KB thumbnail are the only stored versions (no replication or backups counted)

Daily active users (DAU) = 10,000,000 x 10% = 1,000,000

2. Estimates
Uploads per second
Uploads per day = 1,000,000 x 1 = 1,000,000
Average = 1,000,000 / 86,400 = ~11.6 uploads/s
Peak (5x) = ~58 uploads/s
Feed views per second
Feed views per day = 1,000,000 x 50 = 50,000,000
Average = 50,000,000 / 86,400 = ~579 feed views/s
Peak (5x) = ~2,900 feed views/s
Photo storage per year
Per photo = 2 MB + 0.05 MB = 2.05 MB
Per day = 1,000,000 x 2.05 MB = 2,050,000 MB = 2.05 TB/day
Per year = 2.05 TB x 365 = ~748 TB/year (about 0.75 PB)
Originals: 730 TB
Thumbnails: 18.25 TB
3. Read-heavy or write-heavy?

The system is read-heavy. There are 50,000,000 feed views per day against 1,000,000 uploads per day, a read-to-write ratio of about 50:1.

What this means for the design:

Optimise the read path first: serve images from a CDN, cache feed data, and add read replicas.
Reads can be scaled by copying data (cache, replicas, CDN edges), which is cheap compared with scaling writes.
Writes are low in volume (about 58/s at peak), so a single primary database can handle them for a long time.
Uploads are still heavy in bytes (2 MB each), so they should not tie up app servers; they go straight to object storage and heavy work is done asynchronously.
4. Why photos must not be stored inside the database
Photos are large binary files (2 MB each). At ~748 TB per year, the database would grow enormous, making backups, restores, replication and migrations slow and expensive.
Database storage is much more costly per GB than object storage.
Every photo read would travel through the database, using its memory, disk I/O and connections, which are needed for fast queries.
Databases are not built to serve files over HTTP, and they cannot be fronted by a CDN directly.

Where photos go instead: in object storage (e.g. Amazon S3 or similar). It is cheap, practically unlimited, durable, and can be served through a CDN. The database stores only metadata: photo ID, owner ID, object key/URL, upload time, status, and so on.

5. Architecture diagram
                         +----------------------+
                         |     Users (apps)     |
                         +----------+-----------+
                                    |
              +---------------------+----------------------+
              | image requests                             | API requests
              | (photos + thumbnails)                      | (feed, upload, follow)
              v                                            v
     +-----------------+                        +--------------------+
     |       CDN       |                        |   Load Balancer    |
     | (edge caches)   |                        +---------+----------+
     +--------+--------+                                  |
              | cache miss                  +-------------+-------------+
              |                             |             |             |
              |                             v             v             v
              |                       +----------+  +----------+  +----------+
              |                       |   App    |  |   App    |  |   App    |
              |                       | Server 1 |  | Server 2 |  | Server N |
              |                       +----+-----+  +----+-----+  +----+-----+
              |                            |             |             |
              |        +-------------------+------+------+------+------+
              |        |                          |             |
              |        v                          v             v
              |  +-----------+          +-----------------+  +-----------+
              |  |   Cache   |          |    Database     |  |   Queue   |
              |  | (e.g.     |          |  +-----------+  |  | (thumb-   |
              |  |  Redis)   |          |  |  Primary  |  |  |  nail     |
              |  +-----------+          |  | (writes)  |  |  |  jobs)    |
              |                         |  +-----+-----+  |  +-----+-----+
              |                         |        | repl.  |        |
              |                         |        v        |        v
              |                         |  +-----------+  |  +-----------+
              |                         |  |   Read    |  |  |  Worker   |
              |                         |  |  Replica  |  |  | (creates  |
              |                         |  | (reads)   |  |  | thumbnail)|
              |                         |  +-----------+  |  +-----+-----+
              |                         +-----------------+        |
              |                                                    |
              |            +----------------------------+          |
              +----------->|      Object Storage        |<---------+
                           | originals (2 MB) +         |
                           | thumbnails (50 KB)         |
                           +----------------------------+
                                     ^
                                     |  direct upload with
                                     |  a pre-signed URL
                              (from the user's app)

Reads of metadata go: App Server -> Cache -> (miss) -> Read Replica. Writes of metadata go to the Primary. Photo bytes go to and from Object Storage, and are served to users through the CDN.

6. Components (one sentence each)
CDN: Serves photos and thumbnails from servers near the user, which cuts latency and keeps most of the heavy image traffic away from our own infrastructure.
Load balancer: Spreads incoming requests across many app servers so no single server is overloaded and a failed server is skipped automatically.
App servers: Run the application logic (authentication, building feeds, handling uploads) and are stateless so we can add more of them to handle more traffic.
Cache: Keeps hot data such as feed results and photo metadata in memory so most reads avoid the database and return in milliseconds.
Database (primary): Is the source of truth for users, follows and photo metadata, and handles all writes consistently.
Read replica: Holds a copy of the primary and serves read queries, which takes load off the primary and lets reads scale for a read-heavy system.
Object storage: Stores the large photo and thumbnail files cheaply and durably at petabyte scale, which a database cannot do economically.
Queue: Holds thumbnail jobs so uploads return quickly and traffic spikes are absorbed instead of overwhelming the workers.
Worker: Takes jobs from the queue and creates the 50 KB thumbnail in the background, so slow image processing never blocks users.
7. Upload flow (step by step)
The user picks a photo in the app and taps upload. The app sends an "I want to upload" request to the API.
The request reaches the load balancer, which forwards it to one of the app servers.
The app server authenticates the user, validates the request (file type, size limit) and inserts a row in the primary database with status = processing.
The app server asks object storage for a pre-signed upload URL for that photo and returns it to the app.
The user's app uploads the 2 MB original directly to object storage using that URL. The photo bytes never pass through the app servers or the database.
When the upload finishes, the app tells the API (or object storage sends an event) that the upload is complete.
The app server puts a "create thumbnail" job (photo ID and object key) onto the queue and immediately responds "upload received" to the user.
A worker picks the job off the queue, downloads the original from object storage and generates a 50 KB thumbnail.
The worker saves the thumbnail to object storage, then updates the photo's row in the primary database to status = ready with the thumbnail location.
The worker (or app server) invalidates or updates the relevant cache entries so the photo can appear in followers' feeds.
Followers who scroll their feed load the metadata through the cache/read replica, and the thumbnail and photo files come through the CDN. If a job fails, it is retried and eventually moved to a dead-letter queue for investigation.
8. Trade-offs
Cache speed vs freshness. Caching feeds makes reads very fast and protects the database, but users may see slightly stale data (e.g. a new photo appearing a few seconds or minutes late). We accept this because feeds do not need to be perfectly real-time, and shorter cache lifetimes (TTLs) trade some speed back for freshness.
Read replica lag (eventual consistency). Replicas scale reads, but they copy data from the primary with a small delay. A user might upload a photo and not see it on their profile instantly. Mitigation: read a user's own recent data from the primary, or from the cache that was updated at write time.
Asynchronous thumbnails (queue + worker). Uploads feel fast and the system handles spikes, but the thumbnail is not available the instant the upload finishes, and we must run extra infrastructure (queue, workers, retry handling). We show a placeholder until the status becomes ready.
Cost vs performance. A CDN, cache, replicas and ~748 TB/year of storage all cost money. Keeping every photo forever is expensive; we could later move old photos to cheaper storage tiers (slower access) to save cost.
Complexity vs simplicity. Each added component (cache, queue, replica, CDN) removes a bottleneck but adds more things to deploy, monitor and debug. With only ~58 writes/s at peak, we start with this lean set of components rather than sharding the database too early.
Summary
Metric	Value
Daily active users	1,000,000
Uploads/s (avg / peak)	~11.6 / ~58
Feed views/s (avg / peak)	~579 / ~2,900
Storage per year	~748 TB (~0.75 PB)
Read:write ratio	~50:1 (read-heavy)