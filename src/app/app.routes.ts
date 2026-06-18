import { Routes } from '@angular/router';
import { HompageComponent } from './hompage/hompage.component';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { AdminComponent } from './admin/admin.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ManagerComponent } from './manager/manager.component';
import { CustomerComponent } from './customer/customer.component';

export const routes: Routes = [
    { path: '', component: HompageComponent },
    { path: 'login', component: LoginComponent },
    { path: 'signup', component: SignupComponent },
    { path: 'admin', component: AdminComponent },
    { path: 'customer', component: CustomerComponent },
    { path: 'customer-dashboard', component: CustomerComponent },
    { path: 'dashboard', redirectTo: 'customer', pathMatch: 'full' },
    { path: 'manager', component: ManagerComponent },
    // common alternative paths redirected to homepage
    { path: 'home', redirectTo: '', pathMatch: 'full' },
    { path: 'first', redirectTo: '', pathMatch: 'full' },
    { path: 'firth', redirectTo: '', pathMatch: 'full' },
    // wildcard fallback -> homepage
    { path: '**', redirectTo: '', pathMatch: 'full' },
];
