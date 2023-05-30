# ImageMagick Node Web API

A web API to convert, cache, and serve images with ImageMagick

## Usage

```sh
npm start
```

Send `POST` request to `http://localhost:5100` with:

```sh
Content-type: "application/x-www-form-urlencoded"
```

**Required params:**

- `imageurl`: the URL of the image you want to transform

- `entry`: the entrypoint ImageMagick command tool. Currently only accepts `convert`.

- `options`: the ImageMagick command options, without the input file and output file.  
For example: `-resize 50%` or `-crop 40x30+10+10`.

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

To change the URL from which the transformed images are served, create a `.env` file with the variable:

```sh
# no trailing slash
SERVICE_URL=https://my-domain.com
```

To change the name of the folder in which transformed images are stored:

```sh
# specify a directory name. It will be created automatically.
CACHE_DIR=img
```

In which case, the returned data will look like:

```json
{
    "success": 1,
    "filename": "my-file.png",
    "transformed": "https://my-domain.com/img/my-file.png"
}
```
