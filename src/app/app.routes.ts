import { Routes } from '@angular/router';
import { HompageComponent } from './hompage/hompage.component';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { AdminComponent } from './admin/admin.component';

export const routes: Routes = [
    { path: '', component: HompageComponent },
    { path: 'login', component: LoginComponent },
    { path: 'signup', component: SignupComponent },
    { path: 'admin', component: AdminComponent },
    // common alternative paths redirected to homepage
    { path: 'home', redirectTo: '', pathMatch: 'full' },
    { path: 'first', redirectTo: '', pathMatch: 'full' },
    { path: 'firth', redirectTo: '', pathMatch: 'full' },
    // wildcard fallback -> homepage
    { path: '**', redirectTo: '', pathMatch: 'full' },
];
