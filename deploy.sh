npm run build

rsync -avzP dist/ www-data@wayand-vps:/srv/docker/invoicer/invoicer-vue/
