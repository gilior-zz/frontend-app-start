import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs/Subject';

import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { CognitoUserPool, CognitoUserAttribute, CognitoUser, ICognitoUserData, AuthenticationDetails, CognitoUserSession } from 'amazon-cognito-identity-js';

import { User } from './user.model';
var poolData = {
  UserPoolId : 'us-east-2_rayBQRfAS', // Your user pool id here
  ClientId : '4jh0jsarhq1b9jp68fm9eb3ejs' // Your client id here
}; 
var userPool = new  CognitoUserPool(poolData);

@Injectable()
export class AuthService {
  registeredUser:CognitoUser;
  authIsLoading = new BehaviorSubject<boolean>(false);
  authDidFail = new BehaviorSubject<boolean>(false);
  authStatusChanged = new Subject<boolean>();
  constructor(private router: Router) {}
  signUp(username: string, email: string, password: string): void {
    this.authIsLoading.next(true);
    const user: User = {
      username: username,
      email: email,
      password: password
    };
   
    const emailAttribute = {
      Name: 'email',
      Value: user.email
    };
    const attrList:CognitoUserAttribute[]=[new CognitoUserAttribute(emailAttribute)]
    userPool.signUp(user.username,user.password,attrList,null,(err, result)=>{
      if (err) {
          // alert(err.message || JSON.stringify(err));
          this.authDidFail.next(true);
          this.authIsLoading.next(false);
          return;
      }      
        this.authDidFail.next(false);
        this.authIsLoading.next(false);      
      this.registeredUser = result.user;
      
  });
    return;
  }
  confirmUser(username: string, code: string) {
    this.authIsLoading.next(true);
    var userPool = new CognitoUserPool(poolData);
    var userData = {
        Username : username,
        Pool : userPool
    };

    var cognitoUser = new CognitoUser(userData);
    cognitoUser.confirmRegistration(code, true, (err, result)=> {
        if (err) {
            alert(err.message || JSON.stringify(err));
            this.authDidFail.next(true);
            this.authIsLoading.next(false);
            return;
        }
        this.authDidFail.next(false);
        this.authIsLoading.next(false);   
        this.router.navigate(['/'])   ;
        console.log('call result: ' + result);
    });
  }
  signIn(username: string, password: string): void {
    this.authIsLoading.next(true);
    const authData = {
      Username: username,
      Password: password
    };
    const authenticationDetails=new AuthenticationDetails(authData);
    var userPool = new CognitoUserPool(poolData);
    var userData = {
      Username : username,
      Pool : userPool
  };
  var cognitoUser = new CognitoUser(userData);
  cognitoUser.authenticateUser(authenticationDetails, {
    onSuccess:(session:CognitoUserSession)=>{
this.authStatusChanged.next(true);
this.authDidFail.next(false);
this.authIsLoading.next(false); 
console.log(session)  ;
    },    
    onFailure:(err)=>{   
      this.authDidFail.next(true);
      this.authIsLoading.next(false);
      console.log(err)  ;
    }
  })
    
    return;
  }
  getAuthenticatedUser() {
    return userPool.getCurrentUser();
  }
  logout() {
    this.getAuthenticatedUser().signOut();
    this.authStatusChanged.next(false);
  }
  isAuthenticated(): Observable<boolean> {
    const user = this.getAuthenticatedUser();
    const obs = Observable.create((observer) => {
      if (!user) {
        observer.next(false);
      } else {
        user.getSession((err,session:CognitoUserSession)=>{
if (err){
  observer.next(false);
}
else{
  if(session.isValid()){
    observer.next(true)
  }
  else{
    observer.next(false);
  }
}
        });
        // observer.next(false);
      }
      observer.complete();
    });
    return obs;
  }
  initAuth() {
    this.isAuthenticated().subscribe(
      (auth) => this.authStatusChanged.next(auth)
    );
  }
}
