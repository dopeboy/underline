#!/bin/bash

cd "$(dirname $0)"

task=$1 # More descriptive name
arg=$2
args=${*:2}

case $task in
    build)
        # Build docker containers. Pass --no-cache to force re-downloading of images.
        # See ./d build --help for additional info

        if [ ! -f .env ]; then
          cp .env.example .env
        fi
        docker-compose build $args
        ;;
    start)
        # Start docker containers.
        # See ./d up --help for additional info
        CURRENT_UID=$(id -u):$(id -g) docker-compose up $args
        ;;
    stop)
        # Stop docker containers.
        docker-compose stop
        ;;
    clean)
        # Remove docker containers (if they exist)
        if docker inspect underline-db > /dev/null 2> /dev/null; then
            docker rm -f underline-db
        fi
        if docker inspect underline-db-test > /dev/null 2> /dev/null; then
            docker rm -f underline-db-test
        fi
        if docker inspect underline > /dev/null 2> /dev/null; then
            docker rm -f underline
        fi
        if docker image inspect underline-db > /dev/null 2> /dev/null; then
            docker rmi underline-db
        fi
        if docker image inspect underline > /dev/null 2> /dev/null; then
            docker rmi underline
        fi
        ;;
    bash)
        # SSH (bash) into server container.
        # Useful for running Django shell commands.
        CURRENT_UID=$(id -u):$(id -g) docker exec -it underline bash
        ;;
    bashdb)
        # SSH (bash) into database container.
        # Useful for running commands directly against database.
        docker exec -it underline-db bash
        ;;
    shell)
        # SSH (bash) into server container.
        # Useful for running Django shell commands.
        docker exec -it underline python manage.py shell
        ;;
    lint)
        # Lint server code automatically with autopep8.
        # WARNING: This updates files in-place.
        docker exec -it underline autopep8 . --in-place --recursive --global-config setup.cfg
        ;;
    dbshell)
        # SSH (bash) into database container.
        # Useful for running postgres commands.
        docker exec -it underline-db psql -U postgres
        ;;
    cleandb)
        # Drop the local database.
        docker exec -it db psql -U postgres underlinedb -c
        docker exec -it db psql -h db -U postgres -c "DROP DATABASE IF EXISTS underlinedb"
        ;;
    migrate)
        # Run database migrations.
        docker exec -it underline python manage.py migrate $args
        ;;
    test)
        # Run the tests against a test database, from a test container.
        # Useful for running Django shell commands.
        if ! docker inspect underline-db-test > /dev/null 2> /dev/null; then
             docker run \
                --detach \
                --name underline-db-test \
                --env-file=.env \
                postgres
        fi

        docker start underline-db-test > /dev/null

        # in a while loop wait for the db test container to really start
        until docker exec -it underline-db-test psql -U postgres -c '\q' > /dev/null 2> /dev/null; do
            sleep 0.5
        done

        docker exec -it underline-db-test psql -U postgres -c "DROP DATABASE IF EXISTS underlinedb"
        docker exec -it underline-db-test psql -U postgres -c "CREATE DATABASE underlinedb"

        docker run \
            -it --rm \
            --name underline-test \
            --link underline-db-test:db \
            -v $(pwd):/code:rw \
            --env-file=.env \
            -e IS_TESTING=true \
            underline \
            test $args
        ;;
    '')
        echo 'Usage: ./d action [params]. For a list of actions, run ./d help'
        ;;
    *)
        echo 'Unknown action '$task'. For a list of the available actions, run ./d help'
        ;;
esac
