import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-hompage',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hompage.component.html',
  styleUrls: ['./hompage.component.css']
})
export class HompageComponent {
  data = signal<any>(null);

  constructor(private api: ApiService) {
    this.api.getTodo().subscribe((res) => this.data.set(res));
  }
}
