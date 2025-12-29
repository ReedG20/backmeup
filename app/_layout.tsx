import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

import '../global.css';

export default function Layout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon src={require('../assets/icons/mic-01-Stroke-Rounded.png')} />
        <Label>Record</Label>
      </NativeTabs.Trigger>
      
      <NativeTabs.Trigger name="sessions">
        <Icon src={require('../assets/icons/menu-square-Stroke-Rounded.png')} />
        <Label>Sessions</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

