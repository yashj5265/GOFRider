import { NavigationContainer } from "@react-navigation/native";
import LauncherScreen from "../screens/common/LauncherScreen";
import AuthNavigation from "./AuthNavigation";
import { useAuth } from "../contexts/AuthContext";
import FrontNavigation from "./FrontNavigation";

const NavigationManager = () => {
    const { isLoggedIn, isLoading } = useAuth();

    if (isLoading) {
        return <LauncherScreen />;
    }

    return (
        <NavigationContainer>
            {isLoggedIn ? <FrontNavigation /> : <AuthNavigation />}
        </NavigationContainer>
    );
};

export default NavigationManager;