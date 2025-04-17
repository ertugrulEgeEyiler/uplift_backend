# uplift_backend
 Uplift app backend


 # docker for elastic search
 docker run -d \
  --name uplift-elasticsearch \
  -p 9200:9200 \
  -e "discovery.type=single-node" \
  -e "xpack.security.enabled=false" \
  docker.elastic.co/elasticsearch/elasticsearch:8.6.2

  http://localhost:9200
  

