mkdir /var/lib/nginx/body
mkdir -p /var/lib/nginx/body
mkdir -p /var/lib/nginx/body
cat /var/log/nginx/error.log 
ls /var/log/nginx/error.log 
ls -l /var/log/nginx/error.log 
chown -R app:app /var/log/nginx
./createsuperuser.sh 
pipenv lock
