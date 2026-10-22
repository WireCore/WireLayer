import {
    Alert,
    Avatar,
    Badge,
    Button,
    Card,
    Checkbox,
    ConfirmDialog,
    Dialog,
    DialogHost,
    Field,
    fonts,
    IconButton,
    Input,
    LiveAnnouncer,
    Menu,
    Progress,
    RadioGroup,
    RadioGroupItem,
    SegmentedControl,
    Select,
    setAppearance,
    StatusDot,
    Switch,
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
    Text,
    toast,
    Toaster,
    Tooltip,
    type ColorMode,
} from '@wirecore/wirelayer-native';
import { themes } from '@wirecore/wirelayer-tokens';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { ArrowRight, Bell, Copy, Ellipsis, Moon, Pencil, Trash2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';
import { DataScreen } from './DataScreen';
import { DisplayScreen } from './DisplayScreen';
import { FormScreen } from './FormScreen';
import '../global.css';

const SafeArea = withUniwind(SafeAreaView);

export function App() {
    // The fonts ship with the app – render once they are loaded
    const [loaded] = useFonts(fonts);
    const [theme, setTheme] = useState('wirecore');
    const [mode, setMode] = useState<ColorMode>('system');
    const [dialog, setDialog] = useState(false);
    const [page, setPage] = useState('components');

    useEffect(() => setAppearance({ theme, mode }), [theme, mode]);

    if (!loaded) return null;

    return (
        <SafeAreaProvider>
            <LiveAnnouncer>
                <SafeArea className="flex-1 bg-bg">
                    <StatusBar style="auto" />
                    <ScrollView contentContainerClassName="gap-6 p-5" keyboardShouldPersistTaps="handled">
                        <View className="flex-row items-center justify-between">
                            <View className="gap-1">
                                <Text variant="label">WireLayer</Text>
                                <Text variant="title">Component Library</Text>
                            </View>
                            <IconButton icon={Bell} label="Notifications" badge={3} />
                        </View>

                        <SegmentedControl
                            label="Page"
                            block
                            items={[
                                { value: 'components', label: 'Components' },
                                { value: 'form', label: 'Form' },
                                { value: 'display', label: 'Display & feedback' },
                                { value: 'data', label: 'Data' },
                            ]}
                            value={page}
                            onValueChange={setPage}
                        />
                        {page === 'form' ? (
                            <FormScreen />
                        ) : page === 'display' ? (
                            <DisplayScreen />
                        ) : page === 'data' ? (
                            <DataScreen />
                        ) : (
                            <>
                                <Tabs
                                    value={mode}
                                    onValueChange={(value) => setMode((value ?? 'system') as ColorMode)}
                                    label="Mode"
                                >
                                    <TabsList>
                                        <TabsTrigger value="system">System</TabsTrigger>
                                        <TabsTrigger value="light">Light</TabsTrigger>
                                        <TabsTrigger value="dark" icon={Moon}>
                                            Dark
                                        </TabsTrigger>
                                    </TabsList>
                                </Tabs>
                                <View className="flex-row flex-wrap gap-2">
                                    {themes.map((item) => (
                                        <Button
                                            key={item.name}
                                            size="sm"
                                            variant={item.name === theme ? 'primary' : 'outline'}
                                            aria-pressed={item.name === theme}
                                            onPress={() => setTheme(item.name)}
                                        >
                                            {item.label}
                                        </Button>
                                    ))}
                                </View>

                                <Card>
                                    <View className="flex-row items-center justify-between">
                                        <Text variant="label">01</Text>
                                        <StatusDot status="success" pulse>
                                            Online
                                        </StatusDot>
                                    </View>
                                    <Text variant="title">Managed Hosting</Text>
                                    <Text variant="muted">Operations and monitoring in German data centers.</Text>
                                    <Progress value={68} label="Load" />
                                    <View className="flex-row flex-wrap gap-2 pt-2">
                                        <Button trailingIcon={ArrowRight}>Start project</Button>
                                        <Button variant="outline">Details</Button>
                                    </View>
                                </Card>

                                <Alert status="warn" title="Certificate expires soon">
                                    Valid for 7 more days.
                                </Alert>

                                <View className="gap-4">
                                    <Field label="Email" helperText="For questions about your request" required>
                                        <Input
                                            placeholder="name@company.com"
                                            keyboardType="email-address"
                                            autoComplete="email"
                                        />
                                    </Field>
                                    <Field label="Service">
                                        <Select
                                            items={[
                                                { value: 'web', label: 'Software & Web' },
                                                { value: 'hosting', label: 'Managed Hosting' },
                                            ]}
                                        />
                                    </Field>
                                    <RadioGroup label="Company size" defaultValue="midsize">
                                        <RadioGroupItem value="startup">Startup</RadioGroupItem>
                                        <RadioGroupItem value="midsize">Midsize company</RadioGroupItem>
                                    </RadioGroup>
                                    <Checkbox>I agree that my details may be processed.</Checkbox>
                                    <Switch icon={Bell} description="By email and push" defaultChecked>
                                        Notifications
                                    </Switch>
                                </View>

                                <View className="flex-row items-center gap-3">
                                    <Tooltip content="Copy configuration">
                                        <IconButton
                                            icon={Copy}
                                            label="Copy"
                                            onPress={() => toast({ title: 'Copied' })}
                                        />
                                    </Tooltip>
                                    <Menu
                                        items={[
                                            { value: 'edit', label: 'Edit', icon: Pencil },
                                            { value: 'delete', label: 'Delete', icon: Trash2, danger: true },
                                        ]}
                                        onSelect={(value) => toast({ title: `Action: ${value}`, type: 'info' })}
                                    >
                                        <IconButton icon={Ellipsis} label="Actions" />
                                    </Menu>
                                    <Avatar name="Max Mustermann" variant="solid" />
                                    <Avatar name="Erika Musterfrau" />
                                    <Badge variant="success">Active</Badge>
                                </View>

                                <Button variant="danger" leadingIcon={Trash2} onPress={() => setDialog(true)}>
                                    Delete server
                                </Button>
                                <Dialog
                                    open={dialog}
                                    onOpenChange={setDialog}
                                    role="alertdialog"
                                    status="danger"
                                    icon={Trash2}
                                    title="Delete server?"
                                    description="web-01 and all backups will be removed permanently."
                                    footer={
                                        <>
                                            <Button variant="outline" size="sm" onPress={() => setDialog(false)}>
                                                Cancel
                                            </Button>
                                            <Button variant="danger" size="sm" onPress={() => setDialog(false)}>
                                                Delete
                                            </Button>
                                        </>
                                    }
                                />

                                <Tabs defaultValue="software" label="Services">
                                    <TabsList>
                                        <TabsTrigger value="software">Software</TabsTrigger>
                                        <TabsTrigger value="hosting">Hosting</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="software">
                                        <Text variant="muted">Custom applications, shops and interfaces.</Text>
                                    </TabsContent>
                                    <TabsContent value="hosting">
                                        <Text variant="muted">Operations and monitoring in German data centers.</Text>
                                    </TabsContent>
                                </Tabs>
                            </>
                        )}
                    </ScrollView>
                    <Toaster />
                    <ConfirmDialog />
                    <DialogHost />
                </SafeArea>
            </LiveAnnouncer>
        </SafeAreaProvider>
    );
}
