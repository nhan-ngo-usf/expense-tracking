'use server';
import { sql } from '@vercel/postgres';
import z from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

//define the schema for the form data
const FormSchema = z.object({
  customerId: z.string({
    invalid_type_error: 'Please select a customer',
  }),
  amount: z.coerce.number().gt(0, { message: 'Please enter a valid amount' }),
  status: z.enum(['paid', 'pending'], {
    invalid_type_error: 'Please select an invoice status',
  }),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });
export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

export async function createInvoice(prevState: State, formData: FormData) {
  //validate form data with zod safeParse
  const validateFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  console.log(validateFields);
  // if validation fails, return error message
  if (!validateFields.success) {
    return {
      errors: validateFields.error.flatten().fieldErrors,
      message: 'Missing fields. Failed to create invoice.',
    };
  }

  //prepare data for insertion
  const { customerId, amount, status } = validateFields.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];

  //insert data into database
  try {
    await sql`
          INSERT INTO invoices (customer_id, amount, status, date)
          VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
        `;
  } catch (error) {
    //if error occurs, log error and throw error message
    console.error('Database Error:', error);
    throw new Error('Failed to create invoice.');
  }
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData,
) {
  const validateFields = UpdateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
  console.log(validateFields);
  // if validation fails, return error message
  if (!validateFields.success) {
    return {
      errors: validateFields.error.flatten().fieldErrors,
      message: 'Missing fields. Failed to update invoice.',
    };
  }
  //prepare data for update
  const { customerId, amount, status } = validateFields.data;
  const amountInCents = amount * 100;
  try {
    //update invoice with new data
    await sql`
                UPDATE invoices
                SET customer_id = ${customerId},
                amount = ${amountInCents},
                status = ${status}
                WHERE id = ${id}
                `;
  } catch (error) {
    //if error occurs, log error and throw error message
    console.error('Database Error:', error);
    return { message: 'Failed to update invoice.' };
  }
  //revalidate the path and redirect to invoices page
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  try {
    throw new Error('Failed to fetch total number of invoices.');
    await sql`DELETE FROM invoices WHERE id = ${id}`;
    revalidatePath('/dashboard/invoices');
    return { message: 'Invoice deleted successfully' };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to delete invoice.');
  }
}
