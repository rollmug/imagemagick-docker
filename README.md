# ImageMagick Node Web API

A web API to convert, cache, and serve images with ImageMagick.

_**This is beta software.** Let me know if you have ideas for improvements or encounter any bugs._

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

For Macs with M1 chips (arm64), you'll have better performance with this:

```sh
cd imagemagick-docker
docker compose -f docker-compose.arm64.yml up -d
```

## Installation without Docker

To use without Docker and run as a local Node app, you must have Imagemagick installed on the machine. For Mac and Linux, install it with homebrew:

```sh
brew install imagemagick
```

Then: 

```sh
cd imagemagick-docker
npm install
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

## Securing the API

It is highly recommended to secure the API endpoint. This package allows you to use Auth0's Machine-to-Machine (M2M) authentication, which will secure your API by authenticating a JWT token provided in the header:

```sh
Authorization: Bearer {your-token}
```

To enable this, you'll need an [Auth0](https://auth0.com) account with an application of type "API" setup. Then, you can provide some details in your environment variables, as detailed below. [More info on setting up Auth0 here.](https://javascript.plainenglish.io/securing-a-node-js-api-with-auth0-7785a8f2c8e3)

## Environment Vars

To change the default settings, create a `.env` file at the root of this package. Possible variables are:

```sh
# specify the service's base url to use for serving images, ie https://domain.com
# no trailing slash. leave empty/unset if using localhost
SERVICE_URL=https://mydomain.com

PORT=5100

# the name of the directory where images will be served from
CACHE_DIR="images"

# Use Auth0 to validate JWTs. 
# Specify the identifier and the base URL for your Auth0 API application
ENABLE_AUTH=false # set to true to protect the API with Auth0 M2M
AUTH_IDENTIFIER="https://identifier-url.com"
AUTH_BASE_URL="https://{your-tenant}.auth0.com/"
```

In the above case, you would send `POST` requests to `https://my-domain.com` and the returned data will look like:

```json
{
    "success": 1,
    "filename": "my-file.png",
    "transformed": "https://my-domain.com/img/my-file.png"
}
```
