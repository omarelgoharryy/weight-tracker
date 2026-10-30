import 'fake-indexeddb/auto';
import { loadAll } from '../src/db/db';

test('fresh database has no settings', async () => expect((await loadAll()).settings).toBeNull());
