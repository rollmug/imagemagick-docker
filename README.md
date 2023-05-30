# ImageMagick Node Web API

A web API to convert, cache, and serve images with ImageMagick

## Installation with Docker (recommended)

Install [Docker](https://www.docker.com) on your machine if it isn't already.

Then, clone this repo:

```sh
git clone https://github.com/rollmug/imagemagick-docker.git
```

and run:

```sh
cd imagemagick-docker
docker compose up -d
```

## Installation without Docker

To use without Docker and run as a local Node app, you must have Imagemagick installed on the machine. For Mac and Linux, install it with homebrew:

```sh
brew install imagemagick
```

Then: 

```sh
cd imagemagick-docker
npm start
```

## General Usage

Send `POST` requests to `http://localhost:5100` with:

```sh
Content-type: "application/x-www-form-urlencoded"
```

## Required POST params:

- `imageurl`: the URL of the image you want to transform

- `entry`: the entrypoint ImageMagick command tool. Currently only accepts `convert`.

- `options`: the ImageMagick command options as an array, without the input file and output file.  
For example: `["-resize", "50%"]` or `["-crop", "40x30+10+10"]`.

- `outputfile`: the desired filename of the resulting image, ie `image-transformed.png`.

## Response

A successful response will look like:

```json
{
    "success": 1,
    "filename": "my-file.png",
    "transformed": "http://localhost:5100/images/my-file.png"
}
```

Or on error, for example if the ImageMagick command failed:

```json
{
    "error": "Could not run 'convert bad cmd' on file: my-file.jpg"
}
```

## Output files

Transformed images will be stored in a directory `public/images`, and can be used locally or served from the URL provided in the data.

## Environment Vars

To change the default settings, create a `.env` file at the root of this package. Possible variables are:

```sh
# configure the domain from which images are served. no trailing slash
# comment out if using localhost
SERVICE_URL=https://my-domain.com

# configure the name of the folder in which transformed images are stored:
CACHE_DIR=img

# configure the local port used:
PORT=5100
```

In the above case, you would send `POST` requests to `https://my-domain.com` and the returned data will look like:

```json
{
    "success": 1,
    "filename": "my-file.png",
    "transformed": "https://my-domain.com/img/my-file.png"
}
```
