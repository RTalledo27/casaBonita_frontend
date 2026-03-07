import { Component, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';

@Component({
    selector: 'app-not-found',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './not-found.component.html',
    styleUrls: ['./not-found.component.scss']
})
export class NotFoundComponent {
    private router = inject(Router);
    private location = inject(Location);

    goHome() {
        this.router.navigate(['/']);
    }

    goBack() {
        this.location.back();
    }
}
