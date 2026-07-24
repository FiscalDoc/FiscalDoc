import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

export const SHARED_IMPORTS = [CommonModule, ReactiveFormsModule, FormsModule, RouterModule] as const;
