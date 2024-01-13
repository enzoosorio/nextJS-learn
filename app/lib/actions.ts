'use server'

import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { AuthError } from 'next-auth';
import { signIn } from '@/auth';

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};
 

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer.',
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.',
  }),
  date: z.string(),
});
 
const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function CreateInvoicess(prevState : State, formData:FormData) {
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }
  console.log(validatedFields);

  const { customerId, amount, status } = validatedFields.data;
    const amountInCents = amount  * 100;

    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
      try {
        await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${formattedDate})
  `; 
      } catch (error) {
        return{
          message : 'Database Error : Failed to Create Invoice'
        }    
      }
  revalidatePath('/dashboard/invoices')
  redirect('/dashboard/invoices');
  
}

export async function UpdateInvoicess( id : string, prevState : State , formData : FormData) {
  
    const validatedFields = UpdateInvoice.safeParse({
      customerId: formData.get('customerId'),
      amount: formData.get('amount'),
      status: formData.get('status'),
    });
   
    if(!validatedFields.success){
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'Missing Fields. Failed to Update Invoice.',
      };
    }

    const {customerId, amount, status} = validatedFields.data

    const amountInCents = amount * 100;
   try {
    await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
  `; 
   
} catch (error) {
      return{
        message : `Error in database. Failed at update invoice. ${error}`
      }    
   }
   
   
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
  
}

export async function DeleteInvoicess(id:string) {
  throw new Error('Failed to Delete Invoice');
  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
    // ya no redireccionamos porque estamos trabajando en la misma ruta invoices
  } catch (error) {
    return{
      message : `Failed to delete the invoice. ${error}`
    }
    
  }
  revalidatePath('/dashboard/invoices');
} 

export async function Authenticate(prevState : string | undefined , formData : FormData) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}