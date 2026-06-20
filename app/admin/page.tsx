import { AdminPanel } from '@/components/admin/admin-panel'
import { getTreeConfig } from '@/app/actions/config'

export const metadata = {
  title: '管理后台 · 毕业签名树',
}

export default async function AdminPage() {
  const config = await getTreeConfig()
  return <AdminPanel initialConfig={config} />
}
