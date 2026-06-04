import { Routes } from '@angular/router';
import { HompageComponent } from './hompage/hompage.component';

export const routes: Routes = [
    { path: '', component: HompageComponent },
    // common alternative paths redirected to homepage
    { path: 'home', redirectTo: '', pathMatch: 'full' },
    { path: 'first', redirectTo: '', pathMatch: 'full' },
    { path: 'firth', redirectTo: '', pathMatch: 'full' },
    // wildcard fallback -> homepage
    { path: '**', redirectTo: '', pathMatch: 'full' },
];
