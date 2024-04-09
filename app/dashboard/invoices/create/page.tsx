import { lusitana } from '@/app/ui/fonts';
import Form from '@/app/ui/invoices/create-form';
import { fetchCustomers } from '@/app/lib/data';
import { custom } from 'zod';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
export default async function Page() {
  //get all customers from fetchCustomers
  const customers = await fetchCustomers();

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Invoices', href: '/dashboard/invoices' },
          { label: 'Create', href: '/dashboard/invoices/create', active: true },
        ]}
      />
      <Form customers={customers} />
    </main>
  );
}
