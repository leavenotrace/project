import { getTreeConfig } from '@/app/actions/config'
import { LeafTreeScreen } from '@/components/screen/leaf-tree-screen'

export const metadata = {
  title: '毕业签名树 · 大屏',
}

export const dynamic = 'force-dynamic'

export default async function ScreenPage() {
  const config = await getTreeConfig()
  return <LeafTreeScreen initialConfig={config} />
}
