# Short URL [![Build Status](https://travis-ci.org/dyong0/short-url.svg?branch=solution%2Fpresentable)](https://travis-ci.org/dyong0/short-url)

Web application shortens URL and redirects to the original URL when one shortened is given. This application varies in several solutions.

# How to Use

1. Run docker-compose up or docker-compose.exe up for Windows
2. Visit http://localhost:8080

# Solution 1: The Simplest [![Build Status](https://travis-ci.org/dyong0/short-url.svg?branch=solution%2Fthe-simplest)](https://travis-ci.org/dyong0/short-url)

## Requirements

- It shortens a URL into a key with its maximum size of 8 characters
- An original URL must have a corresponding one shortened
- It provides a web form where user inputs original URLs and gets their shortened ones
- It redirects to the original URL when a shortened URL is requested
- URL shortening algorithm must be implemented from the scratch

## System Design

### Functions

- URL Shortening
- Routing by short URL

### Architecture

```
[URL shortener]
[   Express   ]
[   Node.js   ]
[   Machine   ]
```

### URL Shortening Algorithm

Map URLs to an integer ranged from 0 to 99999999 incrementally (8 characters)

O(n) in order to guarantee integrity

### URL Matching Algorithm

Hash lookup O(1)



## POST /api/shorten-url

### Overview

Long URL -> Shorten URL -> Store the short URL -> Response with the shorten URL (URL key)

### Request

#### Request Body

Content Type: application/x-www-form-urlencoded

| Name | Validation                               | Default |
| ---- | ---------------------------------------- | ------- |
| url  | Valid urlencoded URL, [refer to this page](http://urlregex.com/) | N/A     |

### Responses and Examples

#### 200 OK

```
http://localhost/1362
```

#### 400 Bad Request

*When validation failed*

```
Invalid URL
```

#### 500 Internal Server Error

*Other unexpected errors*

```

```



## GET /:urlKey

### Overview

Shortened URL -> Find its original -> Response 302 Found redirection to the original

### Request

#### Query Parameters

| Name   | Validation                          | Default |
| ------ | ----------------------------------- | ------- |
| urlKey | Range of 0 to 99999999 *(< 2^32-1)* | N/A     |

Regarding redirection HTTP status code, [refer to this spec](https://www.greenbytes.de/tech/webdav/draft-ietf-httpbis-p2-semantics-26.html#rfc.section.6.4.p.2)

### Responses and Examples

#### 302 Found

```
HTTP/1.1 302 Found
Location: https://original.url
```

#### 404 Not found

*No matched URL*

```

```

#### 500 Internal Server Error

*Other unexpected errors*

```

```



## GET /

### Overview

It renders a form page where user inputs urls and get their shortened ones.

### Layout

```
[Label] [Input of url] [Button to shorten]
[      Display of the shortened url      ]
```



## Open Issues

### Performance

- Linear search for short URL creation doesn't make sense

### Availability

- Mapping between URL and key will be lost when restarted
- Single point failure

### Usability

- URL key space is too small
- No more URL can be registered, once URL key space is fully occupied
- No analysis about usage of URLs
- Original URL might not be reachable
- No access control to certain URLs
- Different URLs pointing a same origin can be registred differently

### Security

- Incremental hash is insecure

# Solution 2: Presentable [![Build Status](https://travis-ci.org/dyong0/short-url.svg?branch=solution%2Fpresentable)](https://travis-ci.org/dyong0/short-url)

This solution is based on the previous one, which revises the previous by solving the critical issues from the last open issue list.

### Performance

- Linear search for short URL creation doesn't make sense

### Availability

- Mapping between URL and key will be lost when restarted
- Single point failure

### Usability

- URL key space is too small
- No more URL can be registered, once URL key space is fully occupied
- No analysis about usage of URLs

### Security

- Incremental hash is insecure

## Additional Requirements

- Search for existence of a URL takes fairly constant time
- Persistence keeps mapping between URL and key
- Multiple instances can cooperate independently
- URL key space becomes bigger than 10^8
- Short URL expires in a certain time
- Store URL usages
- Key is generated by hash function in the form of random string

## System Design

### Architecture

```
[Application, ...] --> [Persistence]
```

### URL Shortening Algorithm

```
random bytes = generate random 1 to 7 bytes

hash = base58_encode (random bytes)

store (hash, url) in hash to url
store (base58_encode of url, hash) in url to hash

return hash
```

It also expands the URL space to 58^8 from 10^8.

## Persistence

Redis will be used as it features:

- Fast Key-value search and store operations
- In-memory but storable in file system

### Data Structure

| Name        | Type                 | Key                                      | Note                            |
| ----------- | -------------------- | ---------------------------------------- | ------------------------------- |
| URL         | String               | `short_url:url:<hash>`                   | URL is stored as base64 encoded |
| Hash        | String               | `short_url:hash:<url>`                   | Key URL is base64 encoded       |
| Clicks      | Incremental (String) | `short_url:url_usages:clicks:<hash>`     | For usage analysis              |
| Referrers   | Set                  | `short_url:url_usages:referrers:<hash>`  | For usage analysis              |
| User Agents | Set                  | `short_url:url_usages:user_agents:<hash>` | For usage analysis              |

They have different rates for the operations(create, read, update, delete). So they need to be separated.

### Data Expiration

Data expires in 1 day. Once expired, the data will be entirely removed. But every update to the data resets  expiration.

*URL usages will be kept in other persistence, but later. It'll be listed in the open issues.*

## Multiple Instances

In the perspective of application, there's nothing to do for this requirement as the application from previous design is horizontally scalable.

*Single point failure issue still remains as nothing has been done in this solution*

## Open Issues

### Availability

- Single point failure

### Usability

- [Hash space in Redis](https://redis.io/topics/faq#what-is-the-maximum-number-of-keys-a-single-redis-instance-can-hold-and-what-the-max-number-of-elements-in-a-hash-list-set-sorted-set) is smaller than one hash function maps
  - 2^32 < 58^8, around 30K times smaller
- No more URL can be registered, once URL key space is fully occupied
  - This issue still remains, even though URL key expiration reduces the number of URLs registered in a certain duration
- URL Usage doesn't remain when expired
- Original URL might not be reachable
- No access control to certain URLs
- Different URLs pointing a same origin can be registred differently