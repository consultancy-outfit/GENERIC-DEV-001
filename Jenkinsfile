#!/usr/bin/env groovy
def gv
properties([
    parameters([
        choice(
            name: 'MICROSERVICE',
            choices: ['Career', 'Compensation', 'Goal', 'Jobs', 'Notification', 'OnBoarding', 'Update', 'One-on-One', 'Review', 'System', 'UserAccount', 'UserProfile', 'Gateway'],
            description: '***Choose the microservice which you want to run***'
        )
    ])
])

pipeline{
    agent any
    environment{
        VERSION="1.1.1"
        PL_IP="192.168.100.123"

    }
    stages{
        stage('Initialization'){
            steps{
                script{
                    switch(params.MICROSERVICE){
                        case 'Career':
                            gv=load 'script-career.groovy'
                            break
                        case 'Compensation':
                            gv=load 'script-compensation.groovy'
                            break
                        case 'Goal':
                            gv=load 'script-goal.groovy'
                            break
                        case 'Jobs':
                            gv=load 'script-jobs.groovy'
                            break
                        case 'Notification':
                            gv=load 'script-notification.groovy'
                            break
                        case 'OnBoarding':
                            gv=load 'script-onboarding.groovy'
                            break
                        case 'Update':
                            gv=load 'script-update.groovy'
                            break
                        case 'One-on-One':
                            gv=load 'script-oneonone.groovy'
                            break
                        case 'Review':
                            gv=load 'script-review.groovy'
                            break
                        case 'System':
                            gv=load 'script-system.groovy'
                            break
                        case 'UserAccount':
                            gv=load 'script-useraccount.groovy'
                            break
                        case 'UserProfile':
                            gv=load 'script-userprofile.groovy'
                            break
                        case 'Gateway':
                            gv=load 'script-gateway.groovy'
                            break
                        default:
                           error "Invalid Microservice Choice!"
                    }
                }
            }
        }
        stage('Deploying Image'){
            steps{
                script{
                    gv.deployImg()
                }
            }
        }
    }
}
