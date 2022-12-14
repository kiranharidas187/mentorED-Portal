import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { map } from 'rxjs';
import { API_CONSTANTS } from '../../constants/apiUrlConstants';
import { localKeys } from '../../constants/localStorage.keys';
import { ApiService } from '../api/api.service';
import { LocalStorageService } from '../local-storage/local-storage.service';
import { ProfileService } from '../profile/profile.service';
import { ToastService } from '../toast/toast.service';
import { UserService } from '../user/user.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private apiService: ApiService,
    private userService: UserService,
    private toastService:ToastService,
    private localStorage: LocalStorageService,
    private router: Router,
    private profile: ProfileService,
    private _snackBar: MatSnackBar
    ) { }

    async createAccount(formData: any) {
      const config = {
        url: API_CONSTANTS.CREATE_ACCOUNT,
        payload: formData,
      };
      return this.apiService.post(config).pipe(
        map((result:any) => {
          this._snackBar.open(result.message, '',{
            duration: 2000,
            verticalPosition: "top",
            panelClass: "success"
          })
          this.setUserInLocal(result).then(()=>{
            return result;
          })
        })
      )
    }

  loginAccount(formData: any){
    const config = {
      url: API_CONSTANTS.ACCOUNT_LOGIN,
      payload: formData
    };
    return this.apiService.post(config).pipe(
      map(async (result:any) => {
        this._snackBar.open(result.message, '',{
          duration: 2000,
          verticalPosition: "top",
          panelClass: "success"
        })
        return await this.setUserInLocal(result);
      })
    )
  }

  logoutAccount() {
    this.localStorage.removeLocalData([localKeys.USER_DETAILS,localKeys.TOKEN,localKeys.SELECTED_LANGUAGE]);
    this.userService.token='';
    this.userService.userEvent.next({});
    this.router.navigate(['/auth/login']);
  }
  
  async setUserInLocal(data: any) {
    let token = _.pick(data.result, ['access_token', 'refresh_token']);
    this.userService.token = token;
    this.userService.userEvent.next(data.result.user);
    await this.localStorage.saveLocalData(localKeys.TOKEN, JSON.stringify(token));
    await this.localStorage.saveLocalData(localKeys.USER_DETAILS, JSON.stringify(data.result.user));
    await this.localStorage.saveLocalData(localKeys.SELECTED_LANGUAGE, data.result.user.preferredLanguage);
    return this.profile.getProfileDetailsWithRole(data.result.user._id, data.result.user.isAMentor).subscribe((user)=>{
      return user
    })
  }
}
