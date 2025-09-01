  // src/app/models/role.model.ts

import { Permission } from "./permission";

  
  export interface Role {
    role_id     : number;
    name        : string;
    guard_name  : string;
    description?: string;
    created_at? : string;
    updated_at? : string;
  
    // Relación many-to-many (Spatie devuelve un array de permisos)
    permissions : Permission[];
  }
  