import { Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  constructor(private router: Router, private route: ActivatedRoute) {}

  open(commands: any[], base: ActivatedRoute) {
    this.router.navigate([{ outlets: { modal: commands } }], {
      relativeTo: base,
    });
  }

  close(base: ActivatedRoute) {
    this.router.navigate([{ outlets: { modal: null } }], {
      relativeTo: base,
    });
  }
}
