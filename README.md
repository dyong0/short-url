# Short URL [![Build Status](https://travis-ci.org/dyong0/short-url.svg?branch=master)](https://travis-ci.org/dyong0/short-url)

Web application shortens URL and redirects to the original URL when one shortened is given. This application varies in several solutions.

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