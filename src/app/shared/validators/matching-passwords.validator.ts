import { AbstractControl, ValidatorFn } from '@angular/forms';

export function matchingPasswordsValidator(controlName: string, matchingControlName: string): ValidatorFn {
  return (formGroup: AbstractControl): {[key: string]: any} | null => {
    const control = formGroup.get(controlName);
    const matchingControl = formGroup.get(matchingControlName);

    if (matchingControl!.errors && !matchingControl!.errors['matching']) {
      // return if another validator has already found an error on the matchingControl
      return null;
    }

    // set error on matchingControl if validation fails
    if (control!.value !== matchingControl!.value) {
      matchingControl!.setErrors({ matching: true });
    } else {
      matchingControl!.setErrors(null);
    }

    return null;
  };
} 