#!/usr/bin/env groovy

def deployImg(){

          lock('pl_be'){
            sshagent(['pl']) {
              sh """
                ssh -o StrictHostKeyChecking=no -tt ubuntu@${PL_IP} '
                  cd pl/PL-DEV-001
                  git pull origin dev
                  npm i
                  docker system prune -af
                  docker compose -f docker-compose.yml up -d --build gateway
                  
                '
              """
            }
          }

}
return this