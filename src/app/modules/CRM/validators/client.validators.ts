import { Validators } from '@angular/forms';

export const clientValidators = {
  first_name: [Validators.required],
  last_name: [Validators.required],
  doc_type: [Validators.required],
  doc_number: [Validators.required, Validators.minLength(8)],
  marital_status: [Validators.required],
  type: [Validators.required],
  primary_phone: [],
  secondary_phone: [],
  email: [],
  address: [],
  date: [],
  occupation: [],
  salary: [],
};
