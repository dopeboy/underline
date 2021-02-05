# underline

## Development

### Backend

```
./d build
./d start
```

Peek inside `./d` for more.

### Frontend
```
cd client
yarn
yarn run start
```

## Deployment

Assuming you've created a Heroku app and have your git configuration done.

```
heroku addons:create heroku-postgresql:hobby-dev
heroku buildpacks:add heroku/nodejs
heroku buildpacks:add heroku/python
heroku config:set SECRET_KEY='123'
git push heroku master
```
